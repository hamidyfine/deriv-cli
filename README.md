# Deriv CLI

Deriv CLI is a front-end smart tool.

## Install

```shell
npm install -g deriv-cli
```

## Usage

After installing the Deriv CLI you need to configure it. Deriv CLI needs your **Redmine** token to work properly.

:::
You can get your Redmine token from your account setting [page](https://redmine.deriv.cloud/my/api_key).
:::

For configuring the Deriv CLI you should run the `config` command:

```shell
dcli config
```

This command will ask you to enter your API token, then it will create a file in your home directory to store the token. Now it is ready to use!

## Commands

### branch

This command can be used for:

-   Creating branch based on [this](https://github.com/binary-com/deriv-app/tree/master/docs/git#branch-naming) doc.

#### options

```shell
dcli branch -c -i <issue_number>
```

-   `-c` is the option to create a branch.
-   `-i` is the option that accepts the issue card number. It is used to fetch data about the card for creating the branch.
