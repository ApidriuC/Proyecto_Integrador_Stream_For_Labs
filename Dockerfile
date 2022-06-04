FROM node:15.11.0 as build-stage

WORKDIR /app


COPY package*.json ./

RUN npm install


# Bundle app source
COPY ./ /app/

ENV REACT_APP_VAULT_HOST=https://streamsforlab3.bucaramanga.upb.edu.co
ENV REACT_APP_VAULT_TOKEN=s.svTh5haBOLUE37V7sjrFKABm
ENV REACT_APP_GATEWAY_SERVICE_BASE_URL=https://streamsforlab.bucaramanga.upb.edu.co/gateway
ENV REACT_APP_VAULT_SECRET_ENV_URI=/v1/kv/env
ENV REACT_APP_VAULT_SECRET_AZURE_URI=/v1/kv/azure
ENV REACT_APP_VAULT_SECRET_GOOGLE_URI=/v1/kv/google
ENV REACT_APP_VIDEO_HOST=https://streamsforlab2.bucaramanga.upb.edu.co/video

RUN npm run build


# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx

COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
