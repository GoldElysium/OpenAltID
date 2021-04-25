<template>
  <v-btn
    elevation="6"
    large
    raised
    @click="login"
  >
    LOGIN WITH DISCORD
  </v-btn>
</template>

<script>
export default {
  name: "DiscordLoginButton",
  methods: {
    login: async function () {
      console.log(this.$route.query.code)
      if (this.$route.query.code) {
        console.log("Already logged in!")
      } else {
        console.log("Number 2")
        let BACKEND_API_URL = "http://127.0.0.1:8000"
        let discord_redirect = await fetch(BACKEND_API_URL + "/auth/uri/discord")
        // eslint-disable-next-line no-unused-vars
        let res_json = await discord_redirect.json()
        //let state = res_json.state
        console.log(window.location.href)
        window.location = res_json.url + encodeURIComponent("http://localhost:8080/")

      }
    }
  },
  async mounted() {
    // ALSO CHECK IF LOGGED IN
    if (this.$route.query.code) {
      let token
      let BACKEND_API_URL = "http://127.0.0.1:8000"

      token = await fetch(BACKEND_API_URL + "/auth/login/discord", {
        method: "post",
        body: JSON.stringify({"access_code": this.$route.query.code, "redirect_uri": "http://localhost:8080/", "state": this.$route.query.state})
      })

      token = await token.json()
      token = token.token

      console.log(token)
      // Temporary will not be receiving the actual object back
     let logged = await fetch(BACKEND_API_URL + "/auth/verify/", {
       method: "post",
       body: JSON.stringify({"token": token})
      })

      logged = await logged.json()
      logged = logged.valid
      console.log(logged)
      this.$router.push("Home")
    }
  }
}
</script>

<style scoped>

</style>