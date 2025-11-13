async function testConnection() {
    try{
        const result = await sql`SELECT 1`;
        console.log('Conectado a Supabase correctamente:', result);
    } catch (error) {
        console.error('Error al conectar a Supabase:', error);
    } finally {
        await sql.end(); //CIerra la conexion a supa
    }
}

testConnection();