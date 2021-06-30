<template>
    <v-layout align-center justify-center column fill-height>
        <v-flex row align-center class="justify-center">
            <v-container class="ma-auto justify-center">
                <v-card class="ma-auto justify-center pa-2" outlined  :width="widthPercent">
                    <v-img
                            :src=avatar
                            width="100%"
                    >
                    </v-img>
                    <v-card-text><h1>Hello, {{ username }}!</h1></v-card-text>
                    <div v-if="verified">
                        <v-card-title class="ma-auto justify-center"><strong>You are verified!</strong></v-card-title>
                    </div>
                    <div v-else>
                        <v-card-title class="ma-auto justify-center"><strong>You are not verified yet!</strong></v-card-title>
                    </div>
                </v-card>

                <v-card class="ma-auto justify-center pa-2" outlined :width="widthPercent">
                    <v-card-title class="ma-auto justify-center">
                        <h4>Click below to connect accounts</h4>
                    </v-card-title>
                    <v-list-item class="ma-auto justify-center pa-2" light>
                        <v-btn class="ma-auto justify-center" large @click="verify">
                            VERIFY
                        </v-btn>
                    </v-list-item>
                </v-card>

                <v-alert class="ma-auto justify-center" v-if="alert" v-model="alert" type="error" dismissible >
                    {{alert_text}}
                </v-alert>

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
        console.log("Identifier:")
        console.log(this.$cookies.get("identifier"))

        if (this.$cookies.get("identifier") !== null && this.$cookies.get("identifier") !== 'undefined') {
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
        widthPercent () {
            switch (this.$vuetify.breakpoint.name) {
                case 'xs': return "90%"
                case 'sm': return "80%"
                case 'md': return "50%"
                case 'lg': return "50%"
                case 'xl': return "50%"
                default : return "50%"
            }
        },
        showAlertMsg () {
            return this.alert
        }
    },
    methods: {
        verify: async function () {
            console.log("Identifier:")
            console.log(this.$cookies.get("identifier"))
            if (this.$store.getters.getLoggedIn && this.$cookies.get("identifier") !== null && this.$cookies.get("identifier") !== 'undefined' ) {
                let response = await fetch(this.$store.state.BACKEND_API_BASEURI + "/user/verify-accounts/" + this.$cookies.get("identifier"), {
                    credentials: 'include'
                })

                if (response.ok) {
                    response = await response.json()
                    this.verified = response.verified
                    if (response.verified === false) {
                        await this.showAlert(response.reason)
                    }
                } else {
                    await this.showAlert(response.statusText)
                }

            } else {
                await this.showAlert("You need to have clicked a link DMed by the Bot!")
                console.error("You must have an identifier to verify")
            }
        },
        showAlert: function (text) {
            this.alert_text = text
            this.alert = true
        }
    },
}
</script>

<style scoped>

</style>