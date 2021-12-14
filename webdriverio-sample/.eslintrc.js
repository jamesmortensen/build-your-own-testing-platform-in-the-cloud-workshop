// .eslintrc.js
module.exports = {
    "parserOptions": {
        "ecmaVersion": 2022
    },
    "plugins": [
        "import"
    ],
    "rules": {
        "import/no-unresolved": [
            2,
            {
                "commonjs": true,
                "amd": false,
                "caseSensitive": true
            }
        ]
    }
}