<template>
  <v-container>
      <v-row>
          <v-card>
              <v-img
              :src=avatar
              >
                  <v-card-title
                  :title=username
                  />
              </v-img>
              <div v-if="verified">
                  <v-card-text><strong>You are already verified!</strong></v-card-text>
              </div>
              <div v-else>
                  <v-card-text :v-if=!verified><strong>You are not verified yet!</strong></v-card-text>
              </div>


          </v-card>
      </v-row>
  </v-container>
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
            this.avatar =  user.avatar
            this.username =  user.username
            this.verified = user.verified
        })
    }
}
</script>

<style scoped>

</style>