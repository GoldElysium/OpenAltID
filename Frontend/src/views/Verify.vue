<template>
  <v-container>
      
    <DiscordLoginButton></DiscordLoginButton>
  </v-container>
</template>

<script>
// @ is an alias to /src
import DiscordLoginButton from "@/components/DiscordLoginButton";

export default {
  name: 'Verify',
  components: {
    DiscordLoginButton
  },
  beforeCreate() {
      console.log("Logged in: "+this.$store.getters.getLoggedIn)
    if (this.$store.getters.getLoggedIn) {
        this.$router.push("dashboard").then()
    }
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
