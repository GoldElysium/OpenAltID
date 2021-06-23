<template>
    <v-layout align-center justify-center column fill-height>
        <v-flex row align-center>
            <v-row>
                <v-col class="ma-auto" cols="auto">
                    <v-container fluid>
                        <v-card class="pa-5 ma-auto" outlined  width="30%">
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
                        <v-card class="ma-auto" outlined>
                            <v-card-title class="justify-center">
                                <h4>Click below to connect accounts</h4>
                            </v-card-title>
                            <v-list-item class="ma-auto pa-4" light>
                                <v-btn class="ma-auto" large @click="verify">
                                    VERIFY
                                </v-btn>
                            </v-list-item>
                        </v-card>
                    </v-container>
                </v-col>
                <v-col class="ma-auto" cols="auto">

                </v-col>
            </v-row>
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
            verified: false
        }
    },
    beforeCreate() {
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
    methods: {
        verify: async function () {
            if (this.$store.getters.getLoggedIn) {
                let response = await fetch(this.$store.state.BACKEND_API_BASEURI + "/user/verify-accounts", {
                    credentials: 'include'
                })

                this.verified = response.verified
                this.$router.go()
            }
        },
    },

}
</script>

<style scoped>

</style>