<template>
    <v-layout align-center justify-center column fill-height>
        <v-flex row align-center>
            <v-row>
                <v-col class="ma-auto" cols="auto">
                    <v-container fluid>
                        <v-card class="pa-5 ma-auto" outlined  width="500">
                            <v-img
                                    :src=avatar
                                    width="100%"
                            >
                            </v-img>
                            <v-card-text><h1>Hello, {{ username }}!</h1></v-card-text>
                            <div v-if="verified">
                                <v-card-text><strong>You are already verified!</strong></v-card-text>
                            </div>
                            <div v-else>
                                <v-card-text :v-if=!verified><strong>You are not verified yet!</strong></v-card-text>
                            </div>
                        </v-card>
                    </v-container>
                </v-col>
                <v-col class="ma-auto" cols="auto">
                    <v-container class="fill-height" >
                        <v-card class="ma-auto" outlined  min-height="200" height=350>
                            <v-card-title>
                                <h4>Click below to connect accounts</h4>
                            </v-card-title>
                            <v-list-item light>
                                <v-btn class="ma-auto" large>
                                    Facebook
                                </v-btn>
                            </v-list-item>
                            <v-list-item light>
                                <v-btn class="ma-auto" large>
                                    Twitter
                                </v-btn>
                            </v-list-item>
                            <v-list-item light>
                                <v-btn class="ma-auto" large >
                                    Google
                                </v-btn>
                            </v-list-item>
                            <v-list-item light>
                                <v-btn class="ma-auto" large>
                                    Reddit
                                </v-btn>
                            </v-list-item>
                            <v-list-item light>
                                <v-btn class="ma-auto" large>
                                    Twitch
                                </v-btn>
                            </v-list-item>
                        </v-card>
                    </v-container>
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
        fetch('http://127.0.0.1:5000' + '/api/user/dash', {
            credentials: "include"
        }).then(response => response.json()).then(user => {
            console.log(user.avatar + " " + user.username + " " + user.verified)
            this.avatar = user.avatar
            this.username = String(user.username)
            this.verified = user.verified
        })
    }
}
</script>

<style scoped>

</style>