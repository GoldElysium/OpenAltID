<template>
        <div v-if="!this.$store.getters.getLoggedIn">
            <v-btn
                elevation="2"
                large
                raised
                @click="login"
            >
                LOGIN
            </v-btn>
        </div>
        <div v-else>
            <v-btn
                elevation="2"
                large
                raised
                @click="logout"
            >
                LOGOUT
            </v-btn>
        </div>
</template>

<script>
export default {
    name: "DiscordLoginButton",
    methods: {
        login: async function () {
            if (!this.$store.getters.getLoggedIn) {
                /*await fetch(this.$store.state.BACKEND_API_BASEURI + "/login", {
                    redirect: 'follow'
                })*/
                window.location.replace(this.$store.state.BACKEND_API_BASEURI + "/user/login")
            }
        },
        logout: async function () {

            let status = await fetch(this.$store.state.BACKEND_API_BASEURI + "/user/logout", {
                credentials: "include"
            })

            console.log(status.json())
            await this.$router.push("Home")
        }
    }
}
</script>

<style scoped>

</style>
