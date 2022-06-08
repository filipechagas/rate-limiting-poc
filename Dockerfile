ARG NODE_IMAGE=node:16.13-alpine

FROM --platform=linux/x86-64 ${NODE_IMAGE}

ARG user node
ENV user $user

RUN npm install -g nodemon

RUN mkdir /app && chown -R $user:$user /app

USER $user

WORKDIR /app

COPY --chown=$user:$user package.json package-lock.json ./

RUN npm install

COPY --chown=$user:$user . ./

CMD [ "nodemon", "index.js" ]
