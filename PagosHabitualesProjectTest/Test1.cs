using Microsoft.AspNetCore.Mvc;
using Moq;
using EduBank.AppWeb.Controllers;
using EduBank.BLL.Services;
using EduBank.Models;
using EduBank.Models.ViewModel;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace PagosHabitualesProjectTest
{
    [TestClass]
    public sealed class PagoHabitualControllerTests
    {
        private readonly Mock<IPagoHabitualService> _mockPagoService;
        private readonly Mock<ICuentaService> _mockCuentaService;
        private readonly Mock<ICategoriaService> _mockCategoriaService;
        private readonly PagoHabitualController _controller;
        private readonly int _usuarioId = 1;

        public PagoHabitualControllerTests()
        {
            _mockPagoService = new Mock<IPagoHabitualService>();
            _mockCuentaService = new Mock<ICuentaService>();
            _mockCategoriaService = new Mock<ICategoriaService>();

            _controller = new PagoHabitualController(
                _mockPagoService.Object,
                _mockCuentaService.Object,
                _mockCategoriaService.Object
            );

            SetupControllerContext();
        }

        private void SetupControllerContext()
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _usuarioId.ToString()),
                new Claim(ClaimTypes.Name, "test@example.com")
            };

            var identity = new ClaimsIdentity(claims, "TestAuth");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [TestMethod]
        public async Task Insertar_ConModeloValido_DeberiaRetornarSuccessTrue()
        {
            // Arrange
            var vmPago = new VMPagoHabitual
            {
                Nombre = "Pago Test",
                Frecuencia = 1,
                UnidadFrecuencia = "M",
                FechaInicio = DateTime.Now,
                CuentaId = 1,
                CategoriaId = 1,
                Monto = 100.50m,
                EsActivo = true,
                AgregarAutomaticamente = true
            };

            _mockPagoService.Setup(s => s.Insertar(It.IsAny<PagosHabituales>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Insertar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);
            Assert.AreEqual("Pago habitual registrado exitosamente", response.message);

            _mockPagoService.Verify(s => s.Insertar(It.Is<PagosHabituales>(p =>
                p.Nombre == vmPago.Nombre &&
                p.UsuarioId == _usuarioId)), Times.Once);
        }

        [TestMethod]
        public async Task Insertar_ConModeloInvalido_DeberiaRetornarSuccessFalse()
        {
            // Arrange
            var vmPago = new VMPagoHabitual();
            _controller.ModelState.AddModelError("Nombre", "Required");

            // Act
            var result = await _controller.Insertar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Datos inválidos", response.message);

            _mockPagoService.Verify(s => s.Insertar(It.IsAny<PagosHabituales>()), Times.Never);
        }

        [TestMethod]
        public async Task Insertar_CuandoServiceRetornaFalse_DeberiaRetornarError()
        {
            // Arrange
            var vmPago = new VMPagoHabitual
            {
                Nombre = "Pago Test",
                Frecuencia = 1,
                UnidadFrecuencia = "M",
                FechaInicio = DateTime.Now,
                CuentaId = 1,
                CategoriaId = 1,
                Monto = 100.50m
            };

            _mockPagoService.Setup(s => s.Insertar(It.IsAny<PagosHabituales>()))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Insertar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Error al registrar el pago habitual", response.message);
        }

        [TestMethod]
        public async Task Insertar_CuandoOcurreExcepcion_DeberiaRetornarMensajeError()
        {
            // Arrange
            var vmPago = new VMPagoHabitual
            {
                Nombre = "Pago Test",
                Frecuencia = 1,
                UnidadFrecuencia = "M",
                FechaInicio = DateTime.Now,
                CuentaId = 1,
                CategoriaId = 1,
                Monto = 100.50m
            };

            _mockPagoService.Setup(s => s.Insertar(It.IsAny<PagosHabituales>()))
                .ThrowsAsync(new Exception("Error de base de datos"));

            // Act
            var result = await _controller.Insertar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Error de base de datos", response.message);
        }

        [TestMethod]
        public async Task Actualizar_ConModeloValidoYPermisos_DeberiaRetornarSuccessTrue()
        {
            // Arrange
            var vmPago = new VMPagoHabitual
            {
                PagoHabitualId = 1,
                Nombre = "Pago Actualizado",
                Frecuencia = 2,
                UnidadFrecuencia = "S",
                FechaInicio = DateTime.Now.AddDays(1),
                CuentaId = 2,
                CategoriaId = 2,
                Monto = 200.75m,
                EsActivo = false
            };

            _mockPagoService.Setup(s => s.PerteneceAUsuario(vmPago.PagoHabitualId, _usuarioId))
                .ReturnsAsync(true);
            _mockPagoService.Setup(s => s.Actualizar(It.IsAny<PagosHabituales>()))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Actualizar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);
            Assert.AreEqual("Pago habitual actualizado exitosamente", response.message);

            _mockPagoService.Verify(s => s.Actualizar(It.Is<PagosHabituales>(p =>
                p.PagoHabitualId == vmPago.PagoHabitualId &&
                p.UsuarioId == _usuarioId)), Times.Once);
        }

        [TestMethod]
        public async Task Actualizar_SinPermisos_DeberiaRetornarError()
        {
            // Arrange
            var vmPago = new VMPagoHabitual { PagoHabitualId = 1 };

            _mockPagoService.Setup(s => s.PerteneceAUsuario(vmPago.PagoHabitualId, _usuarioId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Actualizar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("No tiene permisos para editar este pago", response.message);

            _mockPagoService.Verify(s => s.Actualizar(It.IsAny<PagosHabituales>()), Times.Never);
        }

        [TestMethod]
        public async Task Actualizar_ConModeloInvalido_DeberiaRetornarError()
        {
            // Arrange
            var vmPago = new VMPagoHabitual();
            _controller.ModelState.AddModelError("Nombre", "Required");

            // Act
            var result = await _controller.Actualizar(vmPago);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Datos inválidos", response.message);
        }

        [TestMethod]
        public async Task Eliminar_ConPermisos_DeberiaRetornarSuccessTrue()
        {
            // Arrange
            var pagoId = 1;
            _mockPagoService.Setup(s => s.PerteneceAUsuario(pagoId, _usuarioId))
                .ReturnsAsync(true);
            _mockPagoService.Setup(s => s.Eliminar(pagoId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.Eliminar(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);
            Assert.AreEqual("Pago habitual eliminado exitosamente", response.message);

            _mockPagoService.Verify(s => s.Eliminar(pagoId), Times.Once);
        }

        [TestMethod]
        public async Task Eliminar_SinPermisos_DeberiaRetornarError()
        {
            // Arrange
            var pagoId = 1;
            _mockPagoService.Setup(s => s.PerteneceAUsuario(pagoId, _usuarioId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Eliminar(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("No tiene permisos para eliminar este pago", response.message);

            _mockPagoService.Verify(s => s.Eliminar(pagoId), Times.Never);
        }

        [TestMethod]
        public async Task Eliminar_ConExcepcion_DeberiaRetornarMensajeError()
        {
            // Arrange
            var pagoId = 1;
            _mockPagoService.Setup(s => s.PerteneceAUsuario(pagoId, _usuarioId))
                .ReturnsAsync(true);
            _mockPagoService.Setup(s => s.Eliminar(pagoId))
                .ThrowsAsync(new Exception("Error de conexión"));

            // Act
            var result = await _controller.Eliminar(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Error de conexión", response.message);
        }

        [TestMethod]
        public async Task ObtenerJson_ConIdValido_DeberiaRetornarPago()
        {
            // Arrange
            var pagoId = 1;
            var pago = new PagosHabituales
            {
                PagoHabitualId = pagoId,
                Nombre = "Pago Test",
                Frecuencia = 1,
                UnidadFrecuencia = "M",
                FechaInicio = DateTime.Now,
                CuentaId = 1,
                CategoriaId = 1,
                Monto = 100.50m,
                Comentario = "Comentario test",
                EsActivo = true,
                AgregarAutomaticamente = false
            };

            var pagosList = new List<PagosHabituales> { pago };
            _mockPagoService.Setup(s => s.ObtenerPorUsuario(_usuarioId))
                .ReturnsAsync(pagosList);

            // Act
            var result = await _controller.ObtenerJson(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);

            var data = response.data;
            Assert.AreEqual(pago.PagoHabitualId, data.PagoHabitualId);
            Assert.AreEqual(pago.Nombre, data.Nombre);
            Assert.AreEqual(pago.Monto, data.Monto);
        }

        [TestMethod]
        public async Task ObtenerJson_ConIdNoExistente_DeberiaRetornarError()
        {
            // Arrange
            var pagoId = 999;
            var pagosList = new List<PagosHabituales>();
            _mockPagoService.Setup(s => s.ObtenerPorUsuario(_usuarioId))
                .ReturnsAsync(pagosList);

            // Act
            var result = await _controller.ObtenerJson(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Pago habitual no encontrado", response.message);
        }

        [TestMethod]
        public async Task ObtenerJson_ConExcepcion_DeberiaRetornarError()
        {
            // Arrange
            var pagoId = 1;
            _mockPagoService.Setup(s => s.ObtenerPorUsuario(_usuarioId))
                .ThrowsAsync(new Exception("Error de base de datos"));

            // Act
            var result = await _controller.ObtenerJson(pagoId);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("Error de base de datos", response.message);
        }

        [TestMethod]
        public async Task CambiarEstado_ConPermisos_DeberiaRetornarSuccessTrue()
        {
            // Arrange
            var request = new PagoHabitualController.CambiarEstadoRequest
            {
                PagoHabitualId = 1,
                Activo = false
            };

            _mockPagoService.Setup(s => s.PerteneceAUsuario(request.PagoHabitualId, _usuarioId))
                .ReturnsAsync(true);
            _mockPagoService.Setup(s => s.CambiarEstado(request.PagoHabitualId, request.Activo))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.CambiarEstado(request);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);
            Assert.AreEqual("Pago desactivado exitosamente", response.message);
        }

        [TestMethod]
        public async Task CambiarEstado_ActivandoPago_DeberiaRetornarMensajeCorrecto()
        {
            // Arrange
            var request = new PagoHabitualController.CambiarEstadoRequest
            {
                PagoHabitualId = 1,
                Activo = true
            };

            _mockPagoService.Setup(s => s.PerteneceAUsuario(request.PagoHabitualId, _usuarioId))
                .ReturnsAsync(true);
            _mockPagoService.Setup(s => s.CambiarEstado(request.PagoHabitualId, request.Activo))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.CambiarEstado(request);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsTrue(response.success);
            Assert.AreEqual("Pago activado exitosamente", response.message);
        }

        [TestMethod]
        public async Task CambiarEstado_SinPermisos_DeberiaRetornarError()
        {
            // Arrange
            var request = new PagoHabitualController.CambiarEstadoRequest
            {
                PagoHabitualId = 1,
                Activo = true
            };

            _mockPagoService.Setup(s => s.PerteneceAUsuario(request.PagoHabitualId, _usuarioId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.CambiarEstado(request);

            // Assert
            var jsonResult = result as JsonResult;
            Assert.IsNotNull(jsonResult);

            dynamic response = jsonResult.Value;
            Assert.IsFalse(response.success);
            Assert.AreEqual("No tiene permisos para modificar este pago", response.message);
        }
    }
}