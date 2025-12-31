export default {
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://trems:trems_password@localhost:5432/trems',
  },
}

