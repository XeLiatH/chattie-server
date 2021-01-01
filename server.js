const express = require('express');

const app = express();

const PORT = 8888 || process.env.PORT;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
