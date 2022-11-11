const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const fs = require('fs');

const region = process.env.AWS_DEFAULT_REGION;
const secretName = process.env.DB_SECRET_ID;

const client = new SecretsManagerClient({ region: region });

const main = async () => {
    const command = new GetSecretValueCommand({
        SecretId: secretName,
    });
    const response = await client.send(command);
    const dbSecret = JSON.parse(response.SecretString);

    const dburl = `postgresql://${dbSecret.username}:${dbSecret.password}@${dbSecret.host}:5432/${dbSecret.dbname}?schema=public`;

    fs.writeFile('/tmp/dburl', dburl, (err) => {
        if (err) throw err;
        console.log(`DATABASE_URL = postgresql://${dbSecret.username}:${dbSecret.password}@${dbSecret.host}:5432/${dbSecret.dbname}?schema=public`);

    });
};

process.on("unhandledRejection", (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

main();
