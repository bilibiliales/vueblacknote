<template>
  <div v-html="rendered" />
</template>

<script setup>
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps({
  source: {
    type: String,
    default: ''
  }
})

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

const rendered = computed(() => markdown.render(props.source || ''))
</script>
