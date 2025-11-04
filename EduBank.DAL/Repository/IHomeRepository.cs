using Azure.Identity;
using EduBank.DAL.Repository;
using EduBank.Models.ViewModel;

namespace EduBank.DAL;

public interface IHomeRepository
{
    Task<VMHomeRMensual> ResumenMensualIngresos();
    Task<VMHomeRMensual> ResumenMensualGastos();
    Task<VMHPorcentajeGI> GastosIngresos();
    Task<VMHomeRecordatorios> Recordatorio();

}
