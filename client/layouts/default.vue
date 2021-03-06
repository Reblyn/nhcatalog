<template>
  <v-app>
    <v-app-bar
      clipped-left
      app
      color="primary"
      dark
      flat
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title style="width: 300px" class="ml-0 pl-4">
        <span><nuxt-link to="/" class="white--text">NH Catalog</nuxt-link></span>
      </v-toolbar-title>

      <v-autocomplete
        v-model="selected"
        :items="searchResults"
        :loading="progress"
        :search-input.sync="search"
        prepend-inner-icon="mdi-magnify"
        item-text="name"
        label="Search for an item"
        single-line
        filled
        rounded
        class="mt-7 hidden-sm-and-down"
        return-object
      >
        <template v-slot:item="{ item }">
          <v-list-item-content>
            <v-list-item-title v-text="item.name" />
            <v-list-item-subtitle v-text="item.cat_name" />
          </v-list-item-content>
        </template>
      </v-autocomplete>
      <v-spacer />
      <template v-if="$vuetify.breakpoint.smAndDown" v-slot:extension>
        <v-autocomplete
          v-model="selected"
          :items="searchResults"
          :loading="progress"
          :search-input.sync="search"
          prepend-inner-icon="mdi-magnify"
          item-text="name"
          label="Search for an item"
          single-line
          filled
          rounded
          class="mt-4"
          return-object
        />
      </template>
      <v-btn
        v-if="!isLoggedIn"
        text
        small
        to="/login"
      >
        <v-icon class="hidden-sm-and-up">
          mdi-login
        </v-icon>
        <span class="hidden-sm-and-down">{{ $t('meta.login') }}</span>
      </v-btn>

      <v-btn
        v-if="!isLoggedIn"
        text
        small
        to="/register"
      >
        <v-icon class="hidden-sm-and-up">
          mdi-account-plus
        </v-icon>
        <span class="hidden-sm-and-down">{{ $t('meta.register') }}</span>
      </v-btn>

      <v-btn
        v-if="isLoggedIn"
        text
        small
        to="/profile"
      >
        <v-icon class="hidden-sm-and-up">
          mdi-format-list-bulleted
        </v-icon>
        <span class="hidden-sm-and-down">{{ $t('meta.profile') }}</span>
      </v-btn>

      <v-btn
        text
        small
        to="/settings"
      >
        <v-icon class="hidden-sm-and-up">
          mdi-cogs
        </v-icon>
        <span class="hidden-sm-and-down">{{ $t('meta.settings') }}</span>
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        text
        small
        @click="logout"
      >
        <v-icon class="hidden-sm-and-up">
          mdi-logout
        </v-icon>
        <span class="hidden-sm-and-down">{{ $t('meta.logout') }}</span>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >
      <v-list nav dense expand>
        <v-list-group
          v-for="navi in nav"
          :key="navi.name"
          :prepend-icon="navi.icon"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title class="text-capitalize">
                {{ navi.name }}
              </v-list-item-title>
            </v-list-item-content>
          </template>
          <v-list-item v-for="list in navi.children" :key="list.name" :to="'/' + list.name">
            <v-list-item-content>
              <v-list-item-title class="text-capitalize">
                {{ list.title }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container>
        <nuxt />
      </v-container>
    </v-content>
    <v-footer
      color="primary"
      app
    >
      <v-row justify="center">
        <v-btn
          text
          small
          to="/privacy"
          dark
        >
          Privacy Policy
        </v-btn>
        <v-btn
          text
          small
          href="https://github.com/mirukushake/nhcatalog/"
          target="_blank"
          dark
        >
          Github
        </v-btn>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
  data: () => (
    {
      drawer: null,
      currentLocale: null,
      linkData: null,
      selected: {},
      search: null,
      searchResults: [],
      progress: false,
      error: null,
    }
  ),
  computed: {
    menuItems () {
      return this.$store.state.layout.menuItems;
    },
    nav () {
      return this.$store.state.layout.menuList;
    },
    isLoggedIn () {
      return this.$store.state.auth.loggedIn;
    },
  },
  watch: {
    search (val) {
      val && val.length > 1 && val !== this.selected && this.getSearch(val);
    },
    selected (val) {
      this.$router.push({ path: `/${val.slug}`, query: { search: val.name } });
    },
  },
  mounted () {
    this.getLocale();
    this.getMenuItems();
  },
  methods: {
    getLocale () {
      this.currentLocale = this.$i18n.getLocaleCookie();
    },
    async getMenuItems () {
      const items = await this.$axios.get('/meta');
      const editflat = items.data.flat.map(x => ({ ...x, name: x.slug, id: x.id, title: x.name }));
      const editlist = items.data.categories.map(y => ({ ...y, children: y.children.map(x => ({ name: x.slug, id: x.id, title: x.name })) }));
      await this.$store.dispatch('layout/getItems', { editflat, editlist });
      await this.$store.dispatch('layout/getLangs', items.data.languages);
      if (this.isLoggedIn) {
        const user = await this.$axios.get('/user');
        await this.$store.dispatch('user/changeSettings', {
          textLang: user.data.user.userInfo.data_language,
          subtitleLang: user.data.user.userInfo.subtitles,
          hemisphere: user.data.user.userInfo.hemisphere,
        });
      }
      this.linkData = editlist;
    },
    async getSearch (term) {
      try {
        this.progress = true;
        const results = await this.$axios.get(`/search?q=${term}`);
        this.searchResults = results.data.results;
        this.progress = false;
      } catch (err) {
        this.progress = false;
      }
    },
    async logout () {
      await this.$auth.logout();
      await this.$store.dispatch('user/changeLists', []);
      await this.$store.dispatch('user/changeItems', []);
      this.$router.push({ path: '/login' });
    },
  },
};
</script>
