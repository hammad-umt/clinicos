using System.Linq.Expressions;

namespace ClinicOS.Domain.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T?> GetByIdAsync(int id);
        Task AddAsync(T entity);
        Task Update(T entity);
        Task Delete(T entity);
        Task<IEnumerable<T>> SearchAsync(Expression<Func<T, bool>> predicate);
        Task SaveChangesAsync();
    }
}