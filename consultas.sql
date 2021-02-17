
--informacion usuario  

select nombre,apellido,centroCosto,Departamentos_idDepartamentos,Direcciones_idDirecciones from usuarios 
inner join centrocosto on usuarios.CentroCosto_idCentroCosto = centrocosto.idCentroCosto;