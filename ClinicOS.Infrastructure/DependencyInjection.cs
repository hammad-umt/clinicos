
using ClinicOS.Application.Interfaces;
using ClinicOS.Domain.Entities;
using ClinicOS.Domain.Interfaces;
using ClinicOS.Infrastructure.Persistence;
using ClinicOS.Infrastructure.Persistence.Repositories;
using ClinicOS.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ClinicSystem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // DbContext
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        // Identity
        services.AddIdentity<AppUser, IdentityRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // Repositories
        services.AddScoped<DoctorRepository>();
        services.AddScoped<PatientRepository>();
        services.AddScoped<BillRepository>();
        services.AddScoped<VisitRepository>();
        services.AddScoped<TokenRepository>();
        services.AddScoped<PrescriptionRepository>();
        
        // Generic Repository Interfaces
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IPrescriptionService, PrescriptionService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IBillService, BillService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IClinicService, ClinicService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<IVisitService, VisitService>();
        services.AddScoped<IJwtTokenProvider, JwtTokenProvider>();

        return services;
    }
}