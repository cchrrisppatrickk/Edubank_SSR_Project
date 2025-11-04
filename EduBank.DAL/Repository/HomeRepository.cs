
using EduBank.DAL.DataContext;
using EduBank.Models.ViewModel;
using EduBank.Models;

using Microsoft.EntityFrameworkCore;

namespace EduBank.DAL;

public class HomeRepository : IHomeRepository
{
    private readonly EdubanckssrContext _dbContext;
    private readonly DbSet<Movimiento> _dbSet;

    public HomeRepository(EdubanckssrContext dbContext)
    {
        _dbContext = dbContext;
        _dbSet = _dbContext.Set<Movimiento>();
    }

    public async Task<VMHPorcentajeGI> GastosIngresos()
    {
        var movimientos = await _dbContext.Movimientos.CountAsync();
        if (movimientos == 0)
        {
            return new VMHPorcentajeGI
            {
                Gastos = 0,
                Ingresos = 0
            };
        }
        int totalIngresos = await _dbContext.Movimientos.CountAsync(i => i.Tipo == "I");
        int totalGastos = await _dbContext.Movimientos.CountAsync(t => t.Tipo == "G");
        decimal PorcentajeIngreso = (decimal)totalIngresos / movimientos * 100;
        decimal PorcentajeGasto = (decimal)totalGastos / movimientos * 100;
        return new VMHPorcentajeGI { Ingresos = PorcentajeIngreso, Gastos = PorcentajeGasto };
    }


    public async Task<VMHomeRMensual> ResumenMensualIngresos()
    {
        var hoy = DateTime.UtcNow;
        var inicioMesActual = new DateTime(hoy.Year, hoy.Month, 1);
        var inicioMesAnterior = inicioMesActual.AddMonths(-1);
        var finMesAnterior = inicioMesActual.AddDays(-1);

        decimal IngresosA = await _dbContext.Movimientos.Where(i => i.Tipo == "I" && i.CreadoEn >= inicioMesActual && i.CreadoEn <= hoy).SumAsync(i => i.Monto);
        decimal IngresoP = await _dbContext.Movimientos.Where(I => I.Tipo == "I" && I.CreadoEn >= inicioMesAnterior && I.CreadoEn <= finMesAnterior).SumAsync(i => i.Monto);
        decimal IngresoPorcentaje = IngresoP > 0 ? ((IngresosA - IngresoP) / IngresoP) * 100 : 0;


        return new VMHomeRMensual
        {
            Monto = IngresosA,
            Porcentaje = IngresoPorcentaje
        };


    }

    public async Task<VMHomeRMensual> ResumenMensualGastos()
    {
        var hoy = DateTime.UtcNow;
        var inicioMesActual = new DateTime(hoy.Year, hoy.Month, 1);
        var inicioMesAnterior = inicioMesActual.AddMonths(-1);
        var finMesAnterior = inicioMesActual.AddDays(-1);

        decimal IngresosA = await _dbContext.Movimientos.Where(i => i.Tipo == "I" && i.CreadoEn >= inicioMesActual && i.CreadoEn <= hoy).SumAsync(i => i.Monto);
        decimal IngresoP = await _dbContext.Movimientos.Where(I => I.Tipo == "I" && I.CreadoEn >= inicioMesAnterior && I.CreadoEn <= finMesAnterior).SumAsync(i => i.Monto);

        decimal GastosA = await _dbContext.Movimientos.Where(i => i.Tipo == "G" && i.CreadoEn >= inicioMesActual && i.CreadoEn <= hoy).SumAsync(i => i.Monto);
        decimal GastosP = await _dbContext.Movimientos.Where(I => I.Tipo == "G" && I.CreadoEn >= inicioMesAnterior && I.CreadoEn <= finMesAnterior).SumAsync(i => i.Monto);
        decimal GastosPorcentaje = IngresoP > 0 ? ((IngresosA - IngresoP) / IngresoP) * 100 : 0;

        return new VMHomeRMensual
        {
            Monto = GastosA,
            Porcentaje = GastosPorcentaje
        };
    }
    public async Task<VMHomeRecordatorios> Recordatorio()
    {
        int RPendientes = await _dbContext.RecordatoriosGenerales.CountAsync(r => r.EsActivo == true);
        var hoy = DateTime.UtcNow;
        var fechaReciente = hoy.AddDays(-3);
        int RecoRecientes = await _dbContext.RecordatoriosGenerales.CountAsync(r => r.FechaInicio >= fechaReciente && r.FechaInicio <= hoy && r.EsActivo == true);
        var records = await _dbContext.RecordatoriosGenerales.Where(r => r.EsActivo == true).ToListAsync();
        return new VMHomeRecordatorios
        {
            RecordatoriosPendientes = RPendientes,
            RecordatoriosRecientes = RecoRecientes,
            recordatorio = records
        };
    }

}
