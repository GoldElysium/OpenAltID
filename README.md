# OpenAD
## An open source alternative to other alt detection bots, but most similar to AltDentifier.
### Focus is on stability and performance, with more per server customization. The frontend is running VueJS (w/ Vuetify) and the backend is running Express (w/ PassportJS for auth). The bot is using Discord.py. Redis is used for none permenant storage and messaging while MongoDB handles the permenant database.

___

## How to run the system:
The frontend of the site is deployed as a static site, this project is set up to use Netfily and is the recommended host.

The Backend of the site is designed to be deployed as a docker image on a seperate server with a webserver acting as a reverse proxy in front (Recommended to use NGINX).

The bot will also be run as a docker container once it is made.
