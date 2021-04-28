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
                let discord_redirect = await fetch('http://127.0.0.1:5000' + "/api/auth/uri/discord", {
                    credentials: "include"
                })
                let res_json = await discord_redirect.json()
                // Go to the redirect location
                window.location = res_json.url + encodeURIComponent("http://127.0.0.1:8000/discordredirect")
            }
        },
        logout: async function () {

            let status = await fetch('http://127.0.0.1:5000' + "/api/auth/logout/discord", {
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