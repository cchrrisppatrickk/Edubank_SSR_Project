// EduBank.Models/ViewModel/VMPagoHabitual.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace EduBank.Models.ViewModel
{
    public class VMPagoHabitual
    {
        public int PagoHabitualId { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public string Nombre { get; set; } = null!;

        [Required(ErrorMessage = "La frecuencia es obligatoria")]
        [Range(1, 365, ErrorMessage = "La frecuencia debe estar entre 1 y 365")]
        public int Frecuencia { get; set; }

        [Required(ErrorMessage = "La unidad de frecuencia es obligatoria")]
        [RegularExpression("^(D|S|M)$", ErrorMessage = "La unidad debe ser D (Días), S (Semanas) o M (Meses)")]
        public string UnidadFrecuencia { get; set; } = "D"; // D: Días, S: Semanas, M: Meses

        [Required(ErrorMessage = "La fecha de inicio es obligatoria")]
        public DateTime FechaInicio { get; set; } = DateTime.Today;

        public TimeOnly? Hora { get; set; }

        public DateTime? FechaFin { get; set; }

        [Required(ErrorMessage = "Debe seleccionar una cuenta")]
        public int CuentaId { get; set; }

        [Required(ErrorMessage = "Debe seleccionar una categoría")]
        public int CategoriaId { get; set; }

        [Required(ErrorMessage = "El monto es obligatorio")]
        [Range(0.01, double.MaxValue, ErrorMessage = "El monto debe ser mayor a 0")]
        public decimal Monto { get; set; }

        [StringLength(500, ErrorMessage = "El comentario no puede exceder 500 caracteres")]
        public string? Comentario { get; set; }

        public bool EsActivo { get; set; } = true;

        public bool AgregarAutomaticamente { get; set; } = false;

        // Propiedades para mostrar en la UI
        public string? CuentaNombre { get; set; }
        public string? CategoriaNombre { get; set; }
        public string? ProximaEjecucion { get; set; }
        public string? Estado { get; set; }
    }
}