using System;
using System.Collections.Generic;

namespace EduBank.Models;

public partial class Movimiento
{
    public long MovimientoId { get; set; }
    public int CategoriaId { get; set; }
    public string Tipo { get; set; } = null!;
    public DateTime FechaOperacion { get; set; }
    public decimal Monto { get; set; }
    public string? Comentario { get; set; }
    public DateTime CreadoEn { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public virtual Categoria Categoria { get; set; } = null!;
}
