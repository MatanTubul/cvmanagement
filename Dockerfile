FROM node:8.10.0
RUN mkdir /home/cvmangement
WORKDIR /home/cvmangement
COPY . /home/cvmangement
RUN npm install
EXPOSE 5000

## THE LIFE SAVER
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

CMD /wait && npm run production
