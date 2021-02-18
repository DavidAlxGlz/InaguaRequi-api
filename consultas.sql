
--informacion usuario  

select nombre,apellido,centroCosto,Departamentos_idDepartamentos,Direcciones_idDirecciones from usuarios 
inner join centrocosto on usuarios.CentroCosto_idCentroCosto = centrocosto.idCentroCosto;

--info mas completa usuario
select nombre,apellido,Roles_idRoles,rol,centroCosto,Departamentos_idDepartamentos,Direcciones_idDirecciones from usuarios 
inner join centrocosto on usuarios.CentroCosto_idCentroCosto = centrocosto.idCentroCosto
inner join roles on usuarios.Roles_idroles = roles.idroles;