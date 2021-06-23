<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card shaped elevation="5" class="mx-auto">
          <v-card-title class="text-center">
            <h1>
              Welcome to the HEFS Verification Site
            </h1>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-subtitle>
            <h2>
              From here you are able to connect your various accounts in order to verify your Discord account!
            </h2>
          </v-card-subtitle>
          <v-card-text>
            <h3>
              If you are here then you were selected for additional verification in order to gain access to the server.
              Luckily the process has been made as simple as possible and order to verify all you need to do is click the link that was sent to you by the bot.
              This link will take you to a page that will ask you to sign in with your Discord account and then connect a few different accounts after that.
              Once you have connected some accounts you should be given the role for access to the server shortly!
            </h3>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn
            elevation="24"
            x-large
            rounded
            color="primary"
            href="https://discord.com/invite/holoenfans"
        >
          Join the Discord!
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
// @ is an alias to /src
//import DiscordLoginButton from "@/components/DiscordLoginButton";

export default {
  name: 'Home',
  components: {
    //DiscordLoginButton
  },
  mounted() {
      console.log(this.$store.state.BACKEND_API_BASEURI)
  }
}
</script>

<style>
.iframe-container {
  position: relative;
  overflow: hidden;
  flex: auto;
}

</style>
