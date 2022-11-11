###################################
# Build application
FROM node:16 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
COPY prisma ./prisma/

# RUN apk update && apk add openssl libc6-compat

# Install all dependencies
RUN npm install

COPY . .

RUN npm run build


###################################
FROM node:16 AS modules

# Create app directory
WORKDIR /app

# Install app dependencies
COPY --from=builder /app/package*.json ./
RUN npm install --production

# Install ADOT Lambda extention
WORKDIR /opt

ARG LAYER_LOCATION=${LAYER_LOCATION:-""} 
ENV LAYER_LOCATION=${LAYER_LOCATION}

RUN curl "${LAYER_LOCATION}" --output layer.zip && ls -lh
RUN unzip layer.zip
RUN rm layer.zip

###################################
FROM node:16 AS ecs

RUN apk update && apk add openssl
COPY --from=modules /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]


###################################
FROM public.ecr.aws/lambda/nodejs:16 as lambdafunc

# Copy ADOT Collector for Lambda
WORKDIR /opt
COPY --from=modules /opt/extensions ./extensions
COPY --from=modules /opt/collector-config ./collector-config
COPY --from=builder /app/wrapper-script ./
RUN chmod +x ./wrapper-script

# Copy application modules
WORKDIR /var/task
COPY --from=modules /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env ./
COPY --from=builder /app/wrapper-script.js ./

CMD [ "dist/lambdafunc.handler"]
