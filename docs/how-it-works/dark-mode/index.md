# How Dark Mode works

The Dark Mode toggle sets the `/ls/conf/ui/dark-mode` flag in `localStorage` and adds `body[class="darkmode"]` so `common.css` can apply custom styles:

```css
body.darkmode {
  filter: invert(1);
  background: #000;
}
```

When the app loads, it quickly checks for the flag in `localStorage` and adds the `body.darkmode` class.
