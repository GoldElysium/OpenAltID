<template>
  <div class="home">
    <img
      alt="Vue logo"
      src="../assets/logo.png"
    >
    <DiscordLoginButton />
  </div>
</template>

<script>
// @ is an alias to /src
import DiscordLoginButton from "@/components/DiscordLoginButton";

export default {
  name: 'Home',
  components: {
    DiscordLoginButton
  },
  mounted() {
    console.log(this.$route.query)
  }
}
</script>
