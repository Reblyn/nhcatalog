<template>
  <div class="container">
    <div>
      <h1 v-if="pageInfo" class="display-1 info--text">
        {{ pageInfo ? pageInfo.title : null }}
      </h1>
    </div>
    <dataTable v-if="pageInfo" :id="pageInfo.id" />
  </div>
</template>

<script>
import dataTable from '../components/item_table';

export default {
  components: {
    dataTable,
  },
  data: () => ({
  }),
  computed: {
    pageInfo () {
      const basic = this.$route.path.substr(1);
      return this.$store.getters['layout/getInfo'](basic);
    },
  },
  isLoggedIn () {
    return this.$store.state.auth.loggedIn;
  },
  mounted () {
    this.check404();
    this.getLists();
  },
  methods: {
    check404 () {
      if (this.$store.state.layout.menuItems.filter(r => r.name === this.$route.path.substr(1)).length === 0) {
        return this.$nuxt.error({ statusCode: 404, message: 'Page not found ' });
      }
    },
    async getLists () {
      try {
        if (this.isLoggedIn) {
          this.processing = true;
          const lists = await this.$axios.get('/user/lists');
          if (lists) {
            await this.$store.dispatch('user/changeLists', lists.data.lists);
            this.processing = false;
          } else {
            this.processing = false;
            this.dialogError = 'Could not retrieve lists.';
          }
        }
      } catch (err) {
        this.processing = false;
        this.dialogError = 'Could not retrieve lists.';
      }
    },
  },
  head () {
    return { title: this.pageInfo ? this.pageInfo.title : null };
  },
};
</script>
