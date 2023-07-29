# mnw-api-js

This is a folder that aims to extends near-api-js and provides functionality that originally near-api-js didn't provide.

Anyone who wish to edit this folder should follow the guideline mentioned below:

## Rules

- Every file within the hierachy of this folder should only import anything within this folder. We must make sure this folder can be directly copied and paste into another project to be reused easily in the future.

- Typescript is encouraged.

- Every things that originally near-api-js can do should be reused by using typescript keyword such as `extends`, `super`. We must make sure this folder is compatitble with any future near-api-js upgrade.

- Everything not related to near blockchain should not be written in this folder.

## Todo

- Set up this folder as a npm package
