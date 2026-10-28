import postgres from "postgres";

function url(name: "DATABASE_URL" | "DATABASE_URL_UNPOOLED") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} missing`);
  return value;
}

const globalForSql = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

export function sql() {
  if (!globalForSql.sql) {
    globalForSql.sql = postgres(url("DATABASE_URL"), {
      max: 8,
      ssl: "require",
      prepare: false
    });
  }
  return globalForSql.sql;
}

export function unpooledSql() {
  return postgres(url("DATABASE_URL_UNPOOLED"), {
    max: 1,
    ssl: "require",
    prepare: false
  });
}

export type Sql = ReturnType<typeof sql>;
export type Tx = postgres.TransactionSql;
