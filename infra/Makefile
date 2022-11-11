synth:
	LAYER_LOCATION=`aws lambda get-layer-version-by-arn --arn arn:aws:lambda:ap-northeast-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-7-0:1 --query 'Content.Location' --output text` \
	npx cdk synth
deploy:
	LAYER_LOCATION=`aws lambda get-layer-version-by-arn --arn arn:aws:lambda:ap-northeast-1:901920570463:layer:aws-otel-nodejs-arm64-ver-1-7-0:1 --query 'Content.Location' --output text` \
	npx cdk deploy
