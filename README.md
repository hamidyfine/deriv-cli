# Jarvis

Jarvis is a FE smart tool.

## Install

```shell
npm install -g deriv-jarvis
```

## Usage

After installing the Jarvis you need to configure it. Jarvis need your Redmine token to work properly.

:::
You can get your redmine token from your account setting [page](https://redmine.deriv.cloud/my/api_key).
:::

For configuring the Jarvis you should run `config` command:

```shell
dj config
```

This command will ask you to enter you API token, then it will create a file in your home directory to store the token.

Now Jarvis is ready to use.

## Commands

### branch

This command can be used for:

-   Creating branch based on [this](https://github.com/binary-com/deriv-app/tree/master/docs/git#branch-naming) doc.

#### create

```shell
dj branch -c -i <issue_number>
```

-   `-c` is the option to create a branch.
-   `-i` is the option that accept the issue card number. It is used to fetch data about the card for creating the branch.
