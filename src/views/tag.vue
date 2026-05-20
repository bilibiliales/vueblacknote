<template>
  <div>
    <TaskBoard :views="views" status="all" :tagId="tagId" :newTaskStatus="'todo'" />
  </div>
</template>

<script>
import TaskBoard from '@/components/TaskBoard.vue';

export default {
  name: 'Tag',
  props: { views: Number },
  components: { TaskBoard },
  computed: {
    tagId() {
      return this.$route.params.id;
    }
  },
  methods: {
    checkTagVisibility(tagId) {
      const tag = this.$store.state.tags.find(t => t.id === tagId);
      if (!tag || !tag.show) {
        if (this.$route.path !== `/undefined`) {
          this.$router.push('/');
        }
      }
    }
  },
  created() {
    this.checkTagVisibility(this.tagId);
  },
  watch: {
    '$route.params.id': {
      handler(newId) {
        this.checkTagVisibility(newId);
      },
      immediate: true
    },
    '$store.state.tags': {
      handler() {
        this.checkTagVisibility(this.tagId);
      },
      deep: true
    }
  }
};
</script>
