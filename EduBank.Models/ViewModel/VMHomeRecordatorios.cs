namespace EduBank.Models.ViewModel;

public class VMHomeRecordatorios
{
    public int RecordatoriosPendientes { get; set; }
    public int RecordatoriosRecientes { get; set; }
    public List<RecordatoriosGenerale> recordatorio { get; set; }
    
}
