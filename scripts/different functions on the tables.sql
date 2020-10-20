use supermarket;

Select * from employee;
Select * from login;
Select * from department;
select * from supplier;
select * from suplogin;

delete from supplier where su_id=1;
alter table supplier AUTO_INCREMENT=1;
truncate suplogin;
Select username,emp_id,d_name from (employee left join login on employee.emp_id=login.employee_id) natural join department  where username='manager'
-- basic

insert into department(d_name) values('security');
insert into employee(emp_name,emp_age,emp_gender,salary,emp_address,emp_mobileno,d_id) values('admin',19,'M',0,'Hyderabad',9876787652,1);

update login
set login.emp_id=1
where username='admin';

ALTER TABLE login CHANGE emp_id employee_id int;

desc login;



alter table employee
drop column role;

desc department;
select * from department;
insert into department(d_name) values('security');

alter table customer
add c_mobileno long not null;

select * from department;
select * from employee;

insert into employee(emp_name,emp_age,emp_gender,salary,emp_address,emp_mobileno,d_id) values('admin',19,'M',0,'Hyderabad',9876787652,1);


UPDATE employee 
join department 
set emp_name='Admin' 
where emp_id=1;

delete from login where emp_id<>1;


desc employee
