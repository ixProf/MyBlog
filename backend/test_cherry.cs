using System;
using Npgsql;

var connStr = "Host=ep-twilight-cherry-aesrsmsd-pooler.c-2.us-east-2.aws.neon.tech;Port=5432;Database=neondb;Username=neondb_owner;Password=npg_TQFjd7BP0gAG;SSL Mode=Require;Trust Server Certificate=true;ChannelBinding=Require";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand("SELECT table_name FROM information_schema.tables WHERE table_schema='public';", conn);
await using var reader = await cmd.ExecuteReaderAsync();
while (await reader.ReadAsync())
{
    Console.WriteLine("Table: " + reader.GetString(0));
}
