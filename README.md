# Rax-helper

**Rax-helper** is a VS Code extension for Rax.js.

## Features

- [x] Autocomplete
- [x] Snippets
- [x] support JavaScript and TypeScript language

## Usage

![rax-helper](./rax-helper.gif)

## Snippets

Support snippets list:

- `toast`

  ```
  Toast.show("", 2000);
  ```

- `alert`

  ```
  alert({
    title: 'title',
    content: 'content',
    buttonText: 'tbuttonText'
  }).then(() => {
    console.log('sure');
  });
  ```

- `confirm`

  ```
  confirm({
    title: 'title',
    content: 'tcontent',
    confirmButtonText: 'confirmButtonText',
    cancelButtonText: 'cancelButtonText'
  }).then((confirm) => {
    console.log(confirm);
  });
  ```

- `navpush`

  ```
  Navigate.push({
    url: 'url',
    animated: true // only support weex
  }).then(() => {
  });
  ```

- `navpop`

  ```
  Navigate.pop({
    animated: false // only support weex
  }).then(() => {
  });
  ```

- `navgo`

  ```
  Navigate.go({
    step: '-1',
    animated: false // only support weex
  }).then(() => {
  });
  ```

## Tips

You can put intelliSense in advance by setting `"editor.snippetSuggestions": "top"`

**Enjoy!** 😄
