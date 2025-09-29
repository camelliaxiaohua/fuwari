
```xml
<update id="importIssued">  
    update lfp_subsidy_details_final  
    <set>  
        <!-- distribution_status -->  
        distribution_status = case  
        <foreach collection="list" item="item">  
            when distribution_batch = #{item.distributionBatch}  
            and name = #{item.name}  
            and identity_number = #{item.identityNumber}  
            then #{item.distributionStatus}  
        </foreach>  
        else distribution_status end,  
        <!-- distribution_time -->  
        distribution_time = case  
        <foreach collection="list" item="item">  
            when distribution_batch = #{item.distributionBatch}  
            and name = #{item.name}  
            and identity_number = #{item.identityNumber}  
            then #{distributionTime}  
        </foreach>  
        else distribution_time end,  
        <!-- distribution_error_reason -->  
        distribution_error_reason = case  
        <foreach collection="list" item="item">  
            when distribution_batch = #{item.distributionBatch}  
            and name = #{item.name}  
            and identity_number = #{item.identityNumber}  
            then #{item.distributionErrorReason}  
        </foreach>  
        else distribution_error_reason end,  
        <!-- actual_total_amount -->  
        actual_total_amount = case  
        <foreach collection="list" item="item">  
            when distribution_batch = #{item.distributionBatch}  
            and name = #{item.name}  
            and identity_number = #{item.identityNumber}  
            then #{item.actualTotalAmount}  
        </foreach>  
        else actual_total_amount end,  
        <!-- adjust_remark -->  
        adjust_remark = case  
        <foreach collection="list" item="item">  
            when distribution_batch = #{item.distributionBatch}  
            and name = #{item.name}  
            and identity_number = #{item.identityNumber}  
            then #{item.adjustRemark}  
        </foreach>  
        else adjust_remark end  
    </set>  
    where del_flag = '0'  
    and (distribution_batch, name, identity_number) in  
    <foreach collection="list" item="item" open="(" separator="," close=")">  
        (#{item.distributionBatch}, #{item.name}, #{item.identityNumber})  
    </foreach>  
</update>
```