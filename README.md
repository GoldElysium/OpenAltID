# OpenAltID 
## An open source alternative to other alt detection bots.
### Focus is on stability and performance, with more per server customization. The frontend is running VueJS (w/ BootstrapVue) and the backend is running Express. The bot is using Discord.py. Redis is used for none permenant storage and messaging while MongoDB handles the permenant database.

___

## How to run the system:
The frontend of the site is deployed as a static site, this project is set up to use Netfily and is the recommended host.

The Backend of the site is designed to be deployed as a docker image on a seperate server with a webserver acting as a reverse proxy in front (Recommended to use NGINX).
The Backend needs some type of mongodb to work, either self hosted or on MongoDB Atlas.
The bot will also be run as a docker container once it is made.

For the most part the procedure for running the whole backend is using `git pull` `docker-compose pull` and `docker-compose up --build`
The Docker images are availiable from:
`omneex/api-openaltid`
and 
`omneex/bot-openaltid`
___
## HUGE THANKS TO GoldElysium 
