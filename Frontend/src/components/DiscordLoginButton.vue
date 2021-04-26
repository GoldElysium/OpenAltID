<template>
  <v-card
      class="pa-5 ma-auto"
      ma5
      max-width="30%"
      raised
      shaped
  >
    <v-card-title>

    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-btn
          elevation="6"
          large
          raised
          @click="login"
      >
        LOGIN WITH DISCORD
      </v-btn>
    </v-card-text>
  </v-card>

</template>

<script>
export default {
  name: "DiscordLoginButton",
  methods: {
    login: async function () {
      if (!this.$cookies.isKey("TOKEN")) {
        let BACKEND_API_URL = "http://127.0.0.1:8000"
        let discord_redirect = await fetch(BACKEND_API_URL + "/v1/auth/uri/discord")
        // eslint-disable-next-line no-unused-vars
        let res_json = await discord_redirect.json()
        //let state = res_json.state
        console.log(window.location.href)
        window.location = res_json.url + encodeURIComponent("http://localhost:8080/verify")
      } else {
        console.log("logged in!")
      }
    }
  },
  async mounted() {
    // ALSO CHECK IF LOGGED IN
    if (this.$route.query.code && !this.$cookies.isKey("TOKEN")) {
      console.log("Logging in~~")
      let TOKEN
      let BACKEND_API_URL = "http://127.0.0.1:8000"

      // Login and get the JWT
      TOKEN = await fetch(BACKEND_API_URL + "/v1/auth/login/discord", {
        method: "post",
        body: JSON.stringify({
          "access_code": this.$route.query.code,
          "redirect_uri": "http://localhost:8080/verify",
          "state": this.$route.query.state
        })
      })

      TOKEN = await TOKEN.json()
      console.log(TOKEN)
      TOKEN = TOKEN.TOKEN
      console.log(TOKEN)
      this.$cookies.set('TOKEN', TOKEN, '1h','', '', true)
      console.log(this.$cookies.get('TOKEN'))
      await this.$router.push("Verify")

    } else if (this.$route.query.code && this.$cookies.isKey("TOKEN")) {
      console.log("Logged in and has params")
      await this.$router.push("Verify")

    } else if (this.$cookies.isKey("TOKEN")) {
      console.log("logged in!")

    } else {
      console.log("not logged in!")
    }
  }
}
</script>

<style scoped>

</style>