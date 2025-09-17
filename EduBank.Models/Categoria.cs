﻿using System;
using System.Collections.Generic;

namespace EduBank.Models;

public partial class Categoria
{
    public int CategoriaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public string Tipo { get; set; } = null!;
    public string? Icono { get; set; }
    public string? Color { get; set; }
    public bool Activo { get; set; }
    public virtual ICollection<Movimiento> Movimientos { get; set; } = new List<Movimiento>();
}
