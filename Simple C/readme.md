> ### `exercise1.c` show the for-loop technique.
#### to print * in some shape as formula.
#### Example like this
```
    *     *
   **     **
  ***     ***
 ****     ****
*****     *****
```

#### in code you can see the systax in for-loop
``` C
for(i=1;i<=row;i++)
    {
        for(j=1;j<=row;j++)
        {
            if(j <= i)
                printf("*");
            else
                printf(" ");
        }
        printf("\n");
 ```
 
 #### this formula `j <= i ` can be change if you want to print difference shape.

 #### shape can change follow the matix mxn

| row,col | col-1 | col-2 | col-3 | col-4 | col-5 |
|---------|-------|-------|-------|-------|-------|
| row-1   | 1,1   | 1,2   | 1,3   | 1,4   | 1,5   |
| row-2   | 2,1   | 2,2   | 2,3   | 2,4   | 2,5   |
| row-3   | 3,1   | 3,2   | 3,3   | 3,4   | 3,5   |
| row-4   | 4,1   | 4,2   | 4,3   | 4,4   | 4,5   |
| row-5   | 5,1   | 5,2   | 5,3   | 5,4   | 5,5   |


 ####  This result of `j <= i ` j is col , i is row
 | row,col | col-1 | col-2 | col-3 | col-4 | col-5 |
|---------|-------|-------|-------|-------|-------|
| row-1   | *     |       |       |       |       |
| row-2   | *     | *     |       |       |       |
| row-3   | *     | *     | *     |       |       |
| row-4   | *     | *     | *     | *     |       |
| row-5   | *     | *     | *     | *     | *     |


 #### If you chang `j >= i ` you'll see as below
 | row,col | col-1 | col-2 | col-3 | col-4 | col-5 |
|---------|-------|-------|-------|-------|-------|
| row-1   | *     | *     | *     | *     | *     |
| row-2   |       | *     | *     | *     | *     |
| row-3   |       |       | *     | *     | *     |
| row-4   |       |       |       | *     | *     |
| row-5   |       |       |       |       | *     |

