FROM node:8.10.0
RUN mkdir /home/cvmangement
WORKDIR /home/cvmangement
COPY package.json /home/cvmangement
RUN npm install
COPY . /home/cvmangement
EXPOSE 5000
CMD ["npm", "run","production"]
