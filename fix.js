const fs = require('fs');
const file = 'c:/layanankominfo/src/pages/dashboard/TicketHistory.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/user\?\.role === 'helpdesk'/g, "user?.role === 'HELPDESK'");
code = code.replace(/user\?\.role === 'admin'/g, "user?.role === 'ADMIN'");
code = code.replace(/user\?\.role === 'pegawai'/g, "user?.role === 'PEGAWAI'");
code = code.replace(/user\?\.role === 'user'/g, "(user?.role === 'USER' || user?.role === 'MASYARAKAT')");
code = code.replace(/user\?\.role !== 'helpdesk'/g, "user?.role !== 'HELPDESK'");

fs.writeFileSync(file, code);
console.log('Fixed user roles');
