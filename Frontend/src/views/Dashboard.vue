<template>
    <v-layout align-center justify-center column fill-height>
        <v-flex row align-center>
                    <v-container fluid>
                        <v-card class="pa-5 ma-auto" outlined  :width="widthpercent">
                            <v-img
                                    :src=avatar
                                    width="100%"
                            >
                            </v-img>
                            <v-card-text><h1>Hello, {{ username }}!</h1></v-card-text>
                            <div v-if="verified">
                                <v-card-title class="justify-center"><strong>You are verified!</strong></v-card-title>
                            </div>
                            <div v-else>
                                <v-card-title class="justify-center"><strong>You are not verified yet!</strong></v-card-title>
                            </div>
                        </v-card>
                    </v-container>
                    <v-container>
                        <v-card class="ma-auto" outlined :width="widthpercent">
                            <v-card-title class="justify-center">
                                <h4>Click below to connect accounts</h4>
                            </v-card-title>
                            <v-list-item class="ma-auto pa-4" light>
                                <v-btn class="ma-auto" large @click="verify">
                                    VERIFY
                                </v-btn>
                            </v-list-item>
                            <v-alert class="ma-auto" :value="alert" type="error" dismissible dense transition="fade-transition">
                                {{alert_text}}
                            </v-alert>
                        </v-card>
                    </v-container>
        </v-flex>
    </v-layout>
</template>

<script>
export default {
    name: "Dashboard",
    data() {
        return {
            avatar: "",
            username: "",
            verified: false,
            alert: false,
            alert_text: ""
        }
    },
    beforeCreate() {
        if (localStorage.identifier !== 'undefined') {
            console.log("Has identifier")
        } else {
            console.log("Does not have identifier")
        }
        fetch(this.$store.state.BACKEND_API_BASEURI + '/user/dashboard', {
            credentials: "include"
        }).then(response => response.json()).then(user => {
            console.log(user.avatar + " " + user.username + " " + user.verified)
            this.username = user.username
            this.avatar = user.avatar
            if (user.username !== null) {
                this.avatar = "https://cdn.discordapp.com/avatars/"+user.id+"/"+ user.avatar +" .png?size=4096"
            }
            this.verified = user.verified
        })
    },
    computed: {
        widthpercent () {
            switch (this.$vuetify.breakpoint.name) {
                case 'xs': return "90%"
                case 'sm': return "80%"
                case 'md': return "50%"
                case 'lg': return "50%"
                case 'xl': return "50%"
                default : return "50%"
            }

        }
    },
    methods: {
        verify: async function () {
            if (this.$store.getters.getLoggedIn && localStorage.identifier !== 'undefined') {
                let response = await fetch(this.$store.state.BACKEND_API_BASEURI + "/user/verify-accounts/" + localStorage.getItem("identifier"), {
                    credentials: 'include'
                })

                this.verified = response.verified
                this.$router.go()
            } else {
                await this.showAlert("You need to have clicked a link DMed by the Bot!")
                console.error("You must have an identifier to verify")
            }
        },
        showAlert: async function (text) {
            this.alert_text = text
            this.alert = true

        }
    },

}
</script>

<style scoped>

</style>