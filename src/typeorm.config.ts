import { DataSource } from "typeorm";
import { CandidateProfile } from "./profiles/candidate-profile.entity";

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: [CandidateProfile],
  migrations: [__dirname + "/migrations/*{.js,.ts}"],
  synchronize: false,
});
