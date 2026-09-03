# FROM node:22.23.2-alpine
# # this command is used to set the base image for the container. In this case, we are using the official Node.js image with version 22.23.2 based on Alpine Linux.



# COPY ./Backend . 
# #this command will copy the backend files to the container  

# RUN npm install 
# # THIS COMMAND will install the dependencies for the backend application. It will look for a package.json file in the current directory and install the packages listed in it.

# #node_module will be created in the container and not in the host machine.

# CMD ["node", "server.js"]


# #by default we cannot access the backend application. we need to forward the port 3000 from the container to the host machine. we can do this by using the -p flag when running the container. for example, if we want to forward the port 3000 from the container to the port 3000 on the host machine, we can use the following command:
#     #docker run -p 3000:3000 <image_name>

# #__ to build the frontend to demonstrate multi-stage build__

# # build the frontend [dist folder]
# # copy the dist folder to the backend public folder

FROM node:22.23.2-alpine as frontend-builder

COPY ./Frontend /app

WORKDIR /app

RUN npm install
RUN npm run build

# Build the backend image
FROM node:22.23.2-alpine as backend-builder

COPY ./Backend /app

WORKDIR /app

RUN npm install
COPY  --from=frontend-builder /app/dist /app/public

CMD ["node", "server.js"]
