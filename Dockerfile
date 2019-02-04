FROM node:8.10.0
RUN mkdir /home/cvmangement
WORKDIR /home/cvmangement
COPY . /home/cvmangement
RUN npm install
EXPOSE 5000
CMD ["npm", "run","production"]
